# caixanegra
![Gem](https://img.shields.io/gem/v/caixanegra?logo=ruby&logoColor=red)

An unopinionated flow oriented blackbox designer, executor and debugger to interface your service classes and allow users to manipulate or completely redesign processes using your code.

# Installation
Add this line to your application's Gemfile:

```ruby
gem 'caixanegra'
```

or 

```
bundler add caixanegra
```
# Getting Started
**caixanegra** implements a self-contained designer, which only requires Redis to be able to receive and report back flow descriptors.  
To get started, the only thing you need is to point to your Redis instance and point which classes on your codebase should represent units.

First, mount the engine. Add the line below to `routes.rb` file:

```ruby
mount Caixanegra::Engine, at: "/caixanegra", as: :caixanegra
```

Then, let's create a `caixanegra.rb` initializer (or any name you prefer)

```ruby
Caixanegra.setup do |config|
  config.units = {
    awesome_unit: Caixanegra::Units::AU,
    another_awesome_unit: Some::Other::Namespace::AAU,
    you_can_also: {
      scope_units: Caixanegra::Units::ScopedUnit,
    },
  }
  config.redis = Redis.new
end
```

With the designer configured, you can use `Caixanegra::Manager` to handle the previously stored definition (or an empty one).  
This will give you the UID that **caixanegra** designer will understand.  

```ruby
my_flow = somewhere.get_flow # get from your own persistence or transport solution
uid = Caixanegra::Manager.handler(my_flow || {})
```

You can then safely navigate to the designer.

```ruby
link_to "Some flow", "/caixanegra/design/#{@uid}?unit_scope=optional_scope", target: :blank
```

Saved changes will update the flow definition on Redis, and you must then persist them. You can get the flow definition for any specified **caixanegra** handled UID:

```ruby
updated_flow = Caixanegra::Manager.get(my_uid)
persist_flow(updated_flow) # your own persistence or transport solution. It's a JSON
```

**NOTE:** There's currently no managed way to set callbacks on save actions from the designer. Working on it

Please, refer to [the wiki](https://github.com/sergiorribeiro/caixanegra/wiki) to get to know more about [creating your units](https://github.com/sergiorribeiro/caixanegra/wiki/Creating-units).

# License
**caixanegra** is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
